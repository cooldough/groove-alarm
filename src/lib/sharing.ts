import { Platform, Alert, PermissionsAndroid } from 'react-native';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

export async function saveVideoToCameraRoll(uri: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Save Video',
          message: 'Allow Groove Alarm to save videos to your camera roll?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (
        granted !== PermissionsAndroid.RESULTS.GRANTED &&
        Platform.Version < 33
      ) {
        Alert.alert(
          'Permission Required',
          'Please grant storage access to save videos.',
        );
        return false;
      }
    }

    await CameraRoll.saveAsset(uri, { type: 'video' });
    return true;
  } catch (error) {
    console.error('Failed to save video:', error);
    Alert.alert('Error', 'Failed to save video to camera roll.');
    return false;
  }
}

export async function shareVideoWithBranding(
  videoUri: string,
  score: number,
): Promise<boolean> {
  try {
    const message = `I scored ${score}/100 on Groove Alarm! Can you beat my score? Download Groove Alarm by Kalopsia Labs`;

    await Share.open({
      url: videoUri.startsWith('file://') ? videoUri : `file://${videoUri}`,
      type: 'video/mp4',
      title: 'My Groove Alarm Dance',
      message,
      subject: 'Check out my Groove Alarm dance!',
    });
    return true;
  } catch (error: any) {
    if (error?.message !== 'User did not share') {
      console.error('Failed to share video:', error);
    }
    return false;
  }
}

export async function shareContent(fileUri: string): Promise<boolean> {
  try {
    const mimeType = fileUri.endsWith('.mp4') ? 'video/mp4' : 'image/png';

    await Share.open({
      url: fileUri,
      type: mimeType,
      title: 'Share your Groove Alarm score',
      message: 'Check out my Groove Alarm dance score! Download Groove Alarm by Kalopsia Labs',
    });
    return true;
  } catch (error: any) {
    if (error?.message !== 'User did not share') {
      console.error('Failed to share:', error);
    }
    return false;
  }
}
