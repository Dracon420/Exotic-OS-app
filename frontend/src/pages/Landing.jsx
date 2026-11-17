import Navbar from "@/components/Navbar";
import Hero from "@/components/landing/Hero";
import SupportBanner from "@/components/landing/SupportBanner";
import HowItWorks from "@/components/landing/HowItWorks";
import SafetyFeature from "@/components/landing/SafetyFeature";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Landing() {
    return (
        <div data-testid="landing-page" className="min-h-screen relative">
            <Navbar />
            <main>
                <Hero />
                <SupportBanner />
                <HowItWorks />
                <SafetyFeature />
                <Testimonials />
                <Pricing />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
