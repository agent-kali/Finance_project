import type { Metadata } from "next";
import { WalletsContent } from "./wallets-content";

export const metadata: Metadata = {
  title: "Wallets",
};

export default function WalletsPage() {
  return <WalletsContent />;
}
