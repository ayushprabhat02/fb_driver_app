// services/ShiftValidator.ts
import { AppState, EmitterSubscription } from 'react-native';
import { DateTime } from 'luxon';
import Toast from 'react-native-toast-message';
import checkinService from '@/modules/checkin/services';
import { signOut } from '@/modules/auth/services';

/**
 * ShiftValidator
 * - singleton
 * - start(driverVehicleId) / stop()
 * - validateOnce() with in-flight guard
 * - uses local time (DateTime.now()) for API calls and comparisons
 * - matches existing checkinService implementation for consistency
 */

type NullableTimeout = NodeJS.Timeout | null;

class ShiftValidator {
  private intervalMs = 5 * 60 * 1000; // 5 minutes
  private graceHours = 1; // 1 hour grace
  private intervalId: NullableTimeout = null;
  private isValidating = false;
  private driverVehicleId: string | null = null;
  private appStateSub: EmitterSubscription | null = null;

  start(driverVehicleId: string) {
    if (!driverVehicleId) return;
    // Idempotent: if already running for same id, do nothing
    if (this.intervalId && this.driverVehicleId === driverVehicleId) {
      console.log('[ShiftValidator] already running for', driverVehicleId);
      return;
    }

    this.stop(); // ensure any previous instance is stopped first
    this.driverVehicleId = driverVehicleId;

    // Immediate validation on start
    this.validateOnce().catch((e) => {
      console.warn('[ShiftValidator] initial validation failed', e);
    });

    // periodic validation
    this.intervalId = setInterval(() => {
      console.log('[ShiftValidator] periodic validation tick');
      this.validateOnce().catch((e) => {
        console.warn('[ShiftValidator] periodic validation error', e);
      });
    }, this.intervalMs);

    // Validate when app comes foreground
    this.appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        console.log('[ShiftValidator] app active -> validating');
        this.validateOnce().catch((e) => {
          console.warn('[ShiftValidator] foreground validation error', e);
        });
      }
    });

    console.log('[ShiftValidator] started for', driverVehicleId);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.appStateSub) {
      this.appStateSub.remove();
      this.appStateSub = null;
    }
    this.isValidating = false;
    this.driverVehicleId = null;
    console.log('[ShiftValidator] stopped');
  }

  async validateOnce(): Promise<void> {
    if (!this.driverVehicleId) {
      console.log('[ShiftValidator] no driverVehicleId, skipping validation');
      return;
    }
    if (this.isValidating) {
      console.log('[ShiftValidator] validation in-flight, skipping duplicate call');
      return;
    }
    this.isValidating = true;
    try {
      // IMPORTANT: Use current local time in ISO format WITHOUT timezone offset
      // When GraphQL serializes ISO strings with timezone (+05:30), it converts them to UTC
      // which can result in previous day being sent to the API
      // Solution: Format as ISO without timezone info (YYYY-MM-DDTHH:mm:ss.SSS)
      const currentTime = DateTime.now();
      const dateTime = currentTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
      console.log('[ShiftValidator] validating shift for', this.driverVehicleId, 'at', dateTime);

      // fetch shift schedule for current moment
      const scheduleArray = await checkinService.fetchDriverVehicleId({ dateTime: dateTime });
      const shift = scheduleArray?.[0];

      // No shift => immediate logout (server says there is no active shift for this vehicle)
      if (!shift || !shift.start_time || !shift.end_time) {
        Toast.show({
          type: 'info',
          text1: 'No Active Shift',
          text2: 'No shift found. Please log in again.',
        });
        console.log('[ShiftValidator] no active shift -> signing out');
        await signOut();
        return;
      }

      // Parse shift end time and compare (matching checkinService logic at line 100-102)
      const endTime = DateTime.fromISO(shift.end_time);
      const hoursPastEnd = currentTime.diff(endTime, 'hours').hours;

      console.log('[ShiftValidator] Time comparison:', {
        currentTime: currentTime.toISO(),
        shiftEndTime: endTime.toISO(),
        hoursPastEnd: hoursPastEnd.toFixed(2),
        graceHours: this.graceHours
      });

      if (hoursPastEnd > this.graceHours) {
        Toast.show({
          type: 'info',
          text1: 'Shift Ended',
          text2: 'Your shift has ended.',
        });
        console.log('[ShiftValidator] shift ended > grace -> signing out', {
          hoursPastEnd: hoursPastEnd.toFixed(2),
          currentTime: currentTime.toISO(),
          shiftEnd: endTime.toISO()
        });
        await signOut();
        return;
      }

      // Shift is still valid
      console.log('[ShiftValidator] shift valid ✓', {
        now: currentTime.toISO(),
        shiftEnd: endTime.toISO(),
        hoursPastEnd: hoursPastEnd.toFixed(2),
      });
    } catch (err) {
      // Network/other errors: do not force logout — log & optionally telemetry
      console.warn('[ShiftValidator] validation failed (keep user logged in):', err);
    } finally {
      this.isValidating = false;
    }
  }
}

export const shiftValidator = new ShiftValidator();
