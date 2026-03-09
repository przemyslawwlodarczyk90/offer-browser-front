import { createBrowserRouter } from 'react-router-dom'

const PlaceholderPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>OfferBrowser Frontend</h1>
      <p>Router działa.</p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PlaceholderPage />,
  },
])