"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogOut } from "lucide-react"

export default function AppHeader() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Signed out successfully")
      router.replace("/login")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
    }
  }

  return (
    <header className="bg-gradient-to-r from-[#1b1f2c] to-[#646d59] text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/images/o3p-logo-circle.png" 
              alt="Our Third Place" 
              width={40} 
              height={40} 
              className="rounded-full" 
            />
            <span className="text-2xl font-light" style={{ fontFamily: "Josefin Sans, sans-serif" }}>
              OUR THIRD PLACE
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="hover:text-gray-200 transition-colors">
                Member Portal
              </Link>
              <Link href="/profile" className="hover:text-gray-200 transition-colors">
                Edit Profile
              </Link>
              <Link href="/events" className="hover:text-gray-200 transition-colors">
                Events
              </Link>
              <Link href="/help" className="hover:text-gray-200 transition-colors">
                Help
              </Link>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-gray-200 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
