import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { RoomsSidebar } from '~/domain/rooms/rooms-sidebar'

export const Route = createFileRoute('/rooms')({
  component: AppLayoutComponent,
})

function AppLayoutComponent() {
  return (
    <SidebarProvider>
      <RoomsSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
