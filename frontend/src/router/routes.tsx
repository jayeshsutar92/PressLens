import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout.tsx'
import {
  AnalysisDetailPage,
  AnalysisPage,
  DashboardPage,
  HistoryPage,
  NotFoundPage,
  ScenarioBuilderPage,
  ScenarioDetailPage,
  ScenariosPage,
} from '../pages/index.ts'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'scenarios',
        element: <ScenariosPage />,
      },
      {
        path: 'scenarios/:id',
        element: <ScenarioDetailPage />,
      },
      {
        path: 'scenarios/builder',
        element: <ScenarioBuilderPage />,
      },
      {
        path: 'analysis',
        element: <AnalysisPage />,
      },
      {
        path: 'analysis/:id',
        element: <AnalysisDetailPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

