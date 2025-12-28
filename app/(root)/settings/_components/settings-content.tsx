"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoriesTab from "./categories-tab";
import ProfileTab from "./profile-tab";
import WalletsTab from "./wallets-tab";

export default function SettingsContent() {
  return (
    <>
      <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Image
            alt="settings"
            className="shrink-0"
            height={48}
            src="/settings.svg"
            width={48}
          />
          <div className="space-y-1">
            <h1 className="font-medium text-2xl md:text-3xl">Pengaturan</h1>
            <p className="text-muted-foreground">
              Kelola dompet dan kategori transaksi Anda.
            </p>
          </div>
        </div>
      </header>

      <div className="pt-6 pb-12">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="wallets">Dompet</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="wallets">
            <WalletsTab />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
