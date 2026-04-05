import { Navbar } from '@/components/Navbar'
import { Shield, Cookie, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-8 rounded-xl" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5 md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

          <div className="relative">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Shield className="h-8 w-8" />
            </div>

            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: April 05, 2026</p>

            <div className="prose prose-slate dark:prose-invert mt-10 max-w-none space-y-8 text-muted-foreground">
              <section>
                <p className="text-lg leading-relaxed">
                  Welcome to Homizgo (“we”, “us”, “our”), a platform connecting users, landlords, and PG owners for property and PG rentals in India. This Privacy Policy explains how we collect, use, share, and protect your personal data.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">1. Information We Collect</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Account Information:</strong> Name, email, phone number, password, and profile details.</li>
                  <li><strong>Property & Listing Data:</strong> Property details, photos, location, rent, amenities.</li>
                  <li><strong>Communication Data:</strong> Chat messages, emails, and support tickets.</li>
                  <li><strong>Usage & Technical Data:</strong> IP address, device info, browser type, cookies, and analytics data.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">2. How We Use Your Data</h2>
                <p>We process your data only with your consent or for legitimate purposes, including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Providing and improving our rental matching services.</li>
                  <li>Sending login notifications, chat alerts, and property approval updates.</li>
                  <li>Verifying identities and preventing fraud.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">3. Sharing of Data</h2>
                <p>We share data only as necessary:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>With landlords/PG owners (only relevant property & contact info).</li>
                  <li>With service providers under strict contracts.</li>
                  <li>With government authorities when required by law.</li>
                </ul>
                <p className="mt-4 font-semibold text-foreground italic">We do not sell your personal data.</p>
              </section>

              {/* Cookie Policy Section */}
              <section id="cookie-policy" className="mt-16 rounded-2xl border bg-secondary/20 p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Cookie className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-foreground">Cookie Policy</h2>
                </div>
                
                <p className="mb-6">We use cookies and similar technologies as follows:</p>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-secondary/50 font-heading text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b">Type</th>
                        <th className="px-4 py-3 border-b">Purpose</th>
                        <th className="px-4 py-3 border-b">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-4 font-semibold">Essential</td>
                        <td className="px-4 py-4 text-muted-foreground">Site functionality and security (login, chat)</td>
                        <td className="px-4 py-4 text-xs font-mono">Session</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-semibold">Analytics</td>
                        <td className="px-4 py-4 text-muted-foreground">Understand user behavior to improve the platform</td>
                        <td className="px-4 py-4 text-xs font-mono">1 year</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-semibold">Functional</td>
                        <td className="px-4 py-4 text-muted-foreground">Remember preferences and saved searches</td>
                        <td className="px-4 py-4 text-xs font-mono">6 months</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-semibold">Marketing</td>
                        <td className="px-4 py-4 text-muted-foreground">Show relevant property recommendations</td>
                        <td className="px-4 py-4 text-xs font-mono">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <p className="mt-6 text-sm">
                  You can manage or withdraw consent anytime through your browser settings or our cookie preferences center.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">4. Your Rights</h2>
                <p>You have the right to access, correct, or erase your data. You can withdraw consent at any time.</p>
                <p className="mt-2">To exercise these rights, email us at <a href="mailto:privacy@homizgo.com" className="text-primary hover:underline">privacy@homizgo.com</a>.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">5. Data Security</h2>
                <p>We use industry-standard encryption, access controls, and regular audits to protect your data.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">6. Contact Us</h2>
                <p className="leading-relaxed">
                  <strong>Homizgo</strong><br />
                  Mumbai, Maharashtra, India<br />
                  Email: privacy@homizgo.com<br />
                  
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
