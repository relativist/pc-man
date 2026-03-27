import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./shell/app-layout";
import { CareerPage } from "./views/career-page";
import { HeroPage } from "./views/hero-page";
import { LearningPage } from "./views/learning-page";
import { LifePage } from "./views/life-page";
import { PcOrdersPage } from "./views/pc-orders-page";
import { ShopPage } from "./views/shop-page";
import { SocialPage } from "./views/social-page";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/hero" replace />,
      },
      {
        path: "hero",
        element: <HeroPage />,
      },
      {
        path: "pc",
        element: <PcOrdersPage />,
      },
      {
        path: "shop",
        element: <ShopPage />,
      },
      {
        path: "career",
        element: <CareerPage />,
      },
      {
        path: "learning",
        element: <LearningPage />,
      },
      {
        path: "social",
        element: <SocialPage />,
      },
      {
        path: "life",
        element: <LifePage />,
      },
    ],
  },
]);
