import { createFileRoute } from "@tanstack/react-router";
import { BookingProvider } from "@/components/site/booking-context";
import { Header } from "@/components/site/Header";
import { Tour } from "@/components/site/Tour";
import { Marquee } from "@/components/site/Marquee";
import { Services } from "@/components/site/Services";
import { Hours } from "@/components/site/Hours";
import { Booking } from "@/components/site/Booking";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malik’s Barbers · Mulhuddart Village, Dublin 15" },
      {
        name: "description",
        content: "Walk through Malik’s Barbers, see live opening hours, build your package and book a chair in Mulhuddart Village, Dublin 15.",
      },
      { property: "og:title", content: "Malik’s Barbers · Mulhuddart Village, Dublin 15" },
      {
        property: "og:description",
        content: "Skin fades, beard trims and hot towel shaves. Take the scroll tour and book your chair.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <BookingProvider>
      <Header />
      <main>
        <Tour />
        <Marquee />
        <Services />
        <Hours />
        <Booking />
      </main>
      <Footer />
    </BookingProvider>
  );
}
