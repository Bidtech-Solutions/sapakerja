import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import type { OsPermission } from '@/lib/permission-gate';
import { permissionStore } from '@/lib/permission-store';

/**
 * Pembaca/peminta izin per jenis. Di native, sumber kebenaran adalah status OS (bukan cache);
 * di web (hanya untuk pengembangan) dipakai permissionStore + API browser.
 */
export type PermissionAdapter = {
  get: () => Promise<OsPermission>;
  request: () => Promise<OsPermission>;
};

const GRANTED: OsPermission = { status: 'granted', granted: true, canAskAgain: true };
const UNDETERMINED: OsPermission = { status: 'undetermined', granted: false, canAskAgain: true };

export const cameraPermission: PermissionAdapter = {
  get: async () => {
    if (Platform.OS === 'web')
      return (await permissionStore.getCameraPermission()) ? GRANTED : UNDETERMINED;
    return Camera.getCameraPermissionsAsync();
  },
  request: async () => {
    if (Platform.OS !== 'web') return Camera.requestCameraPermissionsAsync();
    try {
      await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    } catch {
      // Web hanya untuk pengembangan: lanjut dengan kamera simulasi.
    }
    await permissionStore.setCameraPermission(true);
    return GRANTED;
  },
};

export const locationPermission: PermissionAdapter = {
  get: async () => {
    if (Platform.OS === 'web')
      return (await permissionStore.getLocationPermission()) ? GRANTED : UNDETERMINED;
    return Location.getForegroundPermissionsAsync();
  },
  // Hanya foreground (When In Use); izin lokasi latar belakang tidak pernah diminta.
  request: async () => {
    if (Platform.OS !== 'web') return Location.requestForegroundPermissionsAsync();
    await permissionStore.setLocationPermission(true);
    return GRANTED;
  },
};

export const mediaLibraryPermission: PermissionAdapter = {
  get: () => ImagePicker.getMediaLibraryPermissionsAsync(),
  request: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
};

/** Layanan Lokasi (GPS) di perangkat menyala? Web dianggap menyala. */
export async function isLocationServicesEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true;
  }
}
