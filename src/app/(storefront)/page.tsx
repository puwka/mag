import { HomePageView } from "@/components/HomePageView";

export const revalidate = 60;

export default function HomePage() {
  return (
    <div className="main-page-wrapper">
      <HomePageView />
    </div>
  );
}
