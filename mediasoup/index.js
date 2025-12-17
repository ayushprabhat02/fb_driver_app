const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const mediasoup = require("mediasoup");
const { v4: uuid } = require("uuid");

// Express setup
const app = express();
app.use(cors());
app.use(express.static("public"));

// HTTP & WebSocket servers
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// mediasoup worker & in-memory stores
let worker;
const mediaCodecs = [
  { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: { "x-google-start-bitrate": 1000 },
  },
];
const msRooms = new Map(); // roomId => { router, transports, producers, consumers }
const usersByRoom = new Map(); // roomId => Set of userIds
const roomMetadata = new Map(); // roomId => { creationTime, lastActiveTime, roomName, customData }

(async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
  });
  console.log("mediasoup worker created");
  worker.on("died", () => {
    console.error("mediasoup worker died, exiting");
    process.exit(1);
  });
})();

// Health check
app.get("/health", (req, res) => {
  res.send({ status: "ok", rooms: msRooms.size });
});

// Rooms listing API
app.get("/rooms", (req, res) => {
  try {
    console.log("↪  Serving /rooms JSON (filterName:", req.query.filterName, "active:", req.query.active, ")");
    console.log("Current rooms count:", msRooms.size);
    let list = [];

    msRooms.forEach((room, roomId) => {
      try {
        const users = usersByRoom.get(roomId) || new Set();
        const totalCount = users.size;
        // Count producers as streamers
        const streamerCount = Array.from(room.producers.values()).length;
        const viewerCount = totalCount - streamerCount;
        const metadata = roomMetadata.get(roomId);

        list.push({
          roomId,
          streamerCount,
          viewerCount,
          totalCount,
          metadata,
        });
      } catch (roomError) {
        console.error(`Error processing room ${roomId}:`, roomError);
      }
    });

    // filterName
    if (req.query.filterName) {
      const substr = req.query.filterName.toLowerCase();
      list = list.filter((r) =>
        r.metadata.roomName.toLowerCase().includes(substr)
      );
    }

    // active (minutes)
    if (req.query.active) {
      const mins = parseInt(req.query.active, 10);
      const cutoff = Date.now() - mins * 60_000;
      list = list.filter(
        (r) => new Date(r.metadata.lastActiveTime).getTime() >= cutoff
      );
    }

    // sortBy & order
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const order = req.query.order === "desc" ? "desc" : "asc";
      list.sort((a, b) => {
        let va, vb;
        switch (sortBy) {
          case "name":
            va = a.metadata.roomName.toLowerCase();
            vb = b.metadata.roomName.toLowerCase();
            break;
          case "creationTime":
            va = new Date(a.metadata.creationTime).getTime();
            vb = new Date(b.metadata.creationTime).getTime();
            break;
          case "lastActiveTime":
            va = new Date(a.metadata.lastActiveTime).getTime();
            vb = new Date(b.metadata.lastActiveTime).getTime();
            break;
          case "totalCount":
            va = a.totalCount;
            vb = b.totalCount;
            break;
          default:
            return 0;
        }
        if (va < vb) return order === "asc" ? -1 : 1;
        if (va > vb) return order === "asc" ? 1 : -1;
        return 0;
      });
    }

    console.log("Returning list with", list.length, "items");
    res.json(list);
  } catch (error) {
    console.error("ERROR IN /rooms ENDPOINT:", error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      success: false 
    });
  }
});

// Add a simplified test endpoint
app.get("/rooms-test", (req, res) => {
  try {
    const roomCount = msRooms.size;
    const roomIds = Array.from(msRooms.keys());
    const metadataCount = roomMetadata.size;
    
    res.json({
      success: true,
      roomCount,
      roomIds,
      metadataCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection
wss.on("connection", (ws) => {
  ws.id = uuid();
  ws.isAlive = true;
  console.log(`New WS connection: ${ws.id}`);

  ws.on("pong", () => (ws.isAlive = true));
  ws.on("message", (msg) => handleMessage(ws, msg));
  ws.on("close", () => handleLeave(ws));
});

async function handleMessage(ws, raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", error: "Invalid JSON" }));
    return;
  }

  const { type, roomId } = data;
  console.log(`Msg type=${type} from ${ws.id} in room=${roomId}`);

  switch (type) {
    case "join-room":
      return handleJoin(ws, data);
    case "get-rtp-capabilities":
      return sendRtpCapabilities(ws, roomId);
    case "create-send-transport":
      return createTransport(ws, roomId, "send");
    case "create-recv-transport":
      return createTransport(ws, roomId, "recv");
    case "connect-transport":
      return connectTransport(ws, data);
    case "produce":
      return handleProduce(ws, data);
    case "get-producers":
      return sendProducerList(ws, roomId);
    case "consume":
      return handleConsume(ws, data);
    case "resume-consumer":
      return handleResume(ws, data);
    case "leave-room":
      return handleLeave(ws);
    default:
      console.warn(`Unknown type: ${type}`);
  }
}

async function handleJoin(ws, { roomId, isViewer, roomName }) {
  ws.currentRoom = roomId;
  ws.isViewer = isViewer;

  // track users
  if (!usersByRoom.has(roomId)) usersByRoom.set(roomId, new Set());
  usersByRoom.get(roomId).add(ws.id);

  // create or get room
  const room = await getOrCreateRoom(roomId, roomName);

  // update lastActive
  roomMetadata.get(roomId).lastActiveTime = new Date();

  ws.send(
    JSON.stringify({
      type: "room-joined",
      roomId,
      isViewer,
      userId: ws.id,
      userCount: usersByRoom.get(roomId).size,
    })
  );
}

async function getOrCreateRoom(roomId, roomName) {
  if (msRooms.has(roomId)) return msRooms.get(roomId);

  console.log(`Creating room ${roomId}`);
  const router = await worker.createRouter({ mediaCodecs });
  const room = {
    router,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
  };

  msRooms.set(roomId, room);
  roomMetadata.set(roomId, {
    creationTime: new Date(),
    lastActiveTime: new Date(),
    roomName: roomName || roomId,
    customData: {},
  });

  return room;
}

function sendRtpCapabilities(ws, roomId) {
  const room = msRooms.get(roomId);
  if (!room)
    return ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
  ws.send(
    JSON.stringify({
      type: "rtp-capabilities",
      rtpCapabilities: room.router.rtpCapabilities,
    })
  );
}

async function createTransport(ws, roomId, direction) {
  const room = msRooms.get(roomId);
  if (!room)
    return ws.send(JSON.stringify({ type: "error", error: "Room not found" }));

  try {
    const transport = await room.router.createWebRtcTransport({
      listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      appData: { userId: ws.id, direction },
    });

    room.transports.set(transport.id, transport);

    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") transport.close();
    });

    ws.send(
      JSON.stringify({
        type: "transport-created",
        direction,
        transportOptions: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      })
    );
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", error: err.message }));
  }
}

async function connectTransport(ws, { transportId, dtlsParameters }) {
  const room = msRooms.get(ws.currentRoom);
  const transport = room?.transports.get(transportId);
  if (!transport)
    return ws.send(
      JSON.stringify({ type: "error", error: "Transport not found" })
    );

  await transport.connect({ dtlsParameters });
  ws.send(JSON.stringify({ type: "transport-connected", transportId }));
}

async function handleProduce(ws, { transportId, kind, rtpParameters }) {
  const room = msRooms.get(ws.currentRoom);
  const transport = room?.transports.get(transportId);
  if (!transport)
    return ws.send(
      JSON.stringify({ type: "error", error: "Transport not found" })
    );

  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData: { userId: ws.id },
  });
  room.producers.set(producer.id, producer);

  producer.on("transportclose", () => room.producers.delete(producer.id));

  // notify viewers
  wss.clients.forEach((client) => {
    if (
      client !== ws &&
      client.currentRoom === ws.currentRoom 
    ) {
      client.send(
        JSON.stringify({
          type: "new-producer",
          producerId: producer.id,
          producerUserId: ws.id,
          kind,
        })
      );
    }
  });

  ws.send(JSON.stringify({ type: "produced", producerId: producer.id }));
}

function sendProducerList(ws, roomId) {
  const room = msRooms.get(roomId);
  if (!room)
    return ws.send(JSON.stringify({ type: "error", error: "Room not found" }));

  const producers = Array.from(room.producers.values()).map((p) => ({
    producerId: p.id,
    producerUserId: p.appData.userId,
    kind: p.kind,
  }));
  ws.send(JSON.stringify({ type: "producers", producers }));
}

async function handleConsume(ws, { transportId, producerId, rtpCapabilities }) {
  const room = msRooms.get(ws.currentRoom);
  const transport = room?.transports.get(transportId);
  const producer = room?.producers.get(producerId);
  if (!room || !transport || !producer)
    return ws.send(
      JSON.stringify({ type: "error", error: "Invalid consume request" })
    );

  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    return ws.send(
      JSON.stringify({ type: "error", error: "Cannot consume this producer" })
    );
  }

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused: true,
  });
  room.consumers.set(consumer.id, consumer);
  consumer.on("transportclose", () => room.consumers.delete(consumer.id));

  ws.send(
    JSON.stringify({
      type: "consumed",
      consumerParameters: {
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerUserId: producer.appData.userId,
      },
    })
  );
}

async function handleResume(ws, { consumerId }) {
  const room = msRooms.get(ws.currentRoom);
  const consumer = room?.consumers.get(consumerId);
  if (!consumer)
    return ws.send(
      JSON.stringify({ type: "error", error: "Consumer not found" })
    );

  await consumer.resume();
  ws.send(
    JSON.stringify({
      type: "consumer-resumed",
      consumerId,
      kind: consumer.kind,
    })
  );
}

function handleLeave(ws) {
  const roomId = ws.currentRoom;
  if (!roomId) return;
  const room = msRooms.get(roomId);
  if (!room) return;

  // close transports, producers, consumers for this user
  room.transports.forEach((tr) => {
    if (tr.appData.userId === ws.id) tr.close();
  });
  room.producers.forEach((pr) => {
    if (pr.appData.userId === ws.id) pr.close();
  });
  room.consumers.forEach((co) => {
    if (co.appData.userId === ws.id) co.close();
  });

  // remove user from tracking
  const users = usersByRoom.get(roomId);
  users.delete(ws.id);

  // update lastActive
  roomMetadata.get(roomId).lastActiveTime = new Date();

  // cleanup empty room
  if (users.size === 0) {
    room.router.close();
    msRooms.delete(roomId);
    usersByRoom.delete(roomId);
    roomMetadata.delete(roomId);
    console.log(`Room ${roomId} cleaned up`);
  }

  ws.currentRoom = null;
}

// Ping-pong keepalive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(interval));

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
