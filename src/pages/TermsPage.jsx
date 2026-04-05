import { Navbar } from '@/components/Navbar'
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
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
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>

            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Terms & Conditions</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: April 05, 2026</p>

            <div className="prose prose-slate dark:prose-invert mt-10 max-w-none space-y-8 text-muted-foreground">
              <section>
                <p className="text-lg leading-relaxed">
                  By accessing or using Homizgo (the “Platform”), you agree to these Terms of Service (“Terms”). If you do not agree, please do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">1. Our Services</h2>
                <p>Homizgo is a marketplace connecting users seeking PGs/flats with landlords and PG owners. We do not own or manage any properties.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">2. User Accounts</h2>
                <p>You must be at least 18 years old and provide accurate information. You are responsible for keeping your login credentials secure. We may send login confirmation emails for security.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">3. Listings & Bookings</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Landlords/PG owners are solely responsible for the accuracy of listings.</li>
                  <li>Users must verify properties before booking.</li>
                  <li>All agreements (rent, deposit, rules) are directly between user and owner.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">4. Payments & Fees</h2>
                <p>Any payments made through the Platform are processed by third-party providers. Homizgo may charge service fees (clearly disclosed).</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">5. Prohibited Conduct</h2>
                <p>You agree not to post fake listings, harass users, or engage in fraud. Violations may result in account suspension.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">6. Intellectual Property</h2>
                <p>All content on Homizgo belongs to us or our licensors. You may not copy or misuse it.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">7. Limitation of Liability</h2>
                <p>Homizgo is not liable for any disputes between users and owners, property conditions, or losses arising from use of the Platform. Our total liability shall not exceed the fees paid by you in the last 12 months.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">8. Termination</h2>
                <p>We may suspend or terminate your account for violations. You may delete your account anytime.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">9. Governing Law</h2>
                <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Nagpur, Maharashtra.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">10. Changes to Terms</h2>
                <p>We may update these Terms. Continued use after changes means you accept them.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">11. Contact</h2>
                <p>Email: <a href="mailto:support@homizgo.com" className="text-primary hover:underline">support@homizgo.com</a></p>
              </section>

              <div className="mt-12 rounded-2xl bg-secondary/50 p-6 italic">
                By using Homizgo, you confirm you have read and agree to these Terms and our Privacy Policy.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
