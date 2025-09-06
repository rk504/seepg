import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-[#1b1f2c] border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/o3p-logo-circle.png"
                alt="Our Third Place"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-lg font-light text-white" style={{ fontFamily: "Josefin Sans, sans-serif" }}>
                OUR THIRD PLACE
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Building meaningful professional relationships through curated experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/benefits" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Stats
                </Link>
              </li>
            </ul>
          </div>

          {/* Industries */}
          <div className="md:col-span-1">
            <h3 className="text-white font-medium mb-4">Industries</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/industry/finance" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Finance
                </Link>
              </li>
              <li>
                <Link href="/industry/media" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Media
                </Link>
              </li>
              <li>
                <Link
                  href="/industry/entertainment"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Entertainment
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h3 className="text-white font-medium mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@ourthirdplace.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  hello@ourthirdplace.com
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="text-gray-400 hover:text-white transition-colors text-sm">
                  (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Our Third Place. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
