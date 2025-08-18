import {Text} from '@/components';
import {DateTime} from 'luxon';
import {useEffect, useState} from 'react';
import {View} from 'react-native';

type Props = {
  timeLeft: number;
};

const CountdownTimer: React.FC<Props> = ({timeLeft}) => {
  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <View
      style={{
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
        flexDirection: 'row',
      }}>
      <Text weight="600" size="sm" color="complementary">
        OTP Expires in {formattedTime}
      </Text>
    </View>
  );
};

export default CountdownTimer;

// import {Text} from '@/components';
// import {DateTime} from 'luxon';
// import {useEffect, useState} from 'react';
// import {View} from 'react-native';

// const CountdownTimer = ({orderDate}: {orderDate: string}) => {
//   // const orderDate = "2025-05-15T16:02:40.334";
//   const orderTime = DateTime.fromISO(orderDate).setZone('Asia/Kolkata');
//   const [timeLeft, setTimeLeft] = useState(300); // start with 5 minutes

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = DateTime.now().setZone('Asia/Kolkata');
//       const diffInSeconds = now.diff(orderTime, 'seconds').seconds;

//       // If current time is before order time, reset timer to full 5 mins
//       if (diffInSeconds < 0) {
//         setTimeLeft(300);
//         return;
//       }

//       const remaining = 300 - diffInSeconds;
//       setTimeLeft(remaining > 0 ? Math.ceil(remaining) : 0);

//       if (remaining <= 0) {
//         clearInterval(interval);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [orderTime]);

//   const formattedTime = `${Math.floor(timeLeft / 60)
//     .toString()
//     .padStart(2, '0')}:${Math.floor(timeLeft % 60)
//     .toString()
//     .padStart(2, '0')}`;

//   return (
//     <View
//       style={{
//         alignSelf: 'flex-end',
//         justifyContent: 'flex-end',
//         flexDirection: 'row',
//       }}>
//       <Text weight="600" size="sm">
//         OTP Expires in {formattedTime}
//       </Text>
//     </View>
//   );
// };

// export default CountdownTimer;
