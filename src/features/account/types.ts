export interface ProfileData {
  displayName: string
  username: string
  ensName: string
  walletNickname: string
  avatar: string | null
}

export interface WalletData {
  displayName: string
  nickname: string
  network: string
  profileName: string
  address: string
  secondaryAddress: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
}

export interface StoredWallets {
  primary: WalletData | null
  secondary: WalletData | null
}
