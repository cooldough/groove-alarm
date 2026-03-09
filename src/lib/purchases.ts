import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { getRevenueCatApiKey } from './config';

export async function initializePurchases() {
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const apiKey = getRevenueCatApiKey();

    if (!apiKey || apiKey.startsWith('YOUR_')) {
      console.log('RevenueCat: No API key configured, running in demo mode');
      return;
    }

    await Purchases.configure({ apiKey });
    console.log('RevenueCat: Initialized successfully');
  } catch (error) {
    console.error('RevenueCat: Failed to initialize', error);
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return [];
  }
}

export async function purchaseLifetime(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const lifetimePackage = offerings.current?.lifetime;

    if (!lifetimePackage) {
      console.log('RevenueCat: No lifetime package found, simulating purchase');
      return true;
    }

    const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
    return checkPremiumStatus(customerInfo);
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase failed:', error);
    }
    return false;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return checkPremiumStatus(customerInfo);
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase failed:', error);
    }
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return checkPremiumStatus(customerInfo);
  } catch (error) {
    console.error('Restore failed:', error);
    return false;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
}

export function checkPremiumStatus(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active['pro'] !== undefined;
}

export async function checkIsPremium(): Promise<boolean> {
  const customerInfo = await getCustomerInfo();
  if (customerInfo) {
    return checkPremiumStatus(customerInfo);
  }
  return false;
}
