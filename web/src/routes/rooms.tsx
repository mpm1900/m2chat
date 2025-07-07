import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rooms')({
  component: AppLayoutComponent,
})

function AppLayoutComponent() {
  return (
    <div>
      <h1>/rooms</h1>
      <Outlet />
    </div>
  )
}
