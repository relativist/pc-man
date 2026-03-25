import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./shell/app-layout";
import { HeroPage } from "./views/hero-page";
import { LearningPage } from "./views/learning-page";
import { PcOrdersPage } from "./views/pc-orders-page";
import { StubPage } from "./views/stub-page";

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
        path: "career",
        element: (
          <StubPage
            title="Карьера"
            description="Здесь будет поиск работы, вакансии компаний, запрос повышения и движение по карьерной лестнице."
          />
        ),
      },
      {
        path: "learning",
        element: <LearningPage />,
      },
      {
        path: "life",
        element: (
          <StubPage
            title="Хобби и Быт"
            description="Здесь будут прогулки, друзья, семья, питомцы, еда, спорт, здоровье и случайные события."
          />
        ),
      },
    ],
  },
]);
