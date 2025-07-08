import { Link, useParams } from '@tanstack/react-router'
import { RefreshCcwIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useRooms } from '~/hooks/use-rooms'

export function RoomsSidebar() {
  const rooms = useRooms()
  const { roomID } = useParams({ strict: false })

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex flex-row justify-between items-center">
            <SidebarGroupLabel>Rooms ({rooms.data?.length})</SidebarGroupLabel>
            <Button
              variant="ghost"
              className="size-7 opacity-60 hover:opacity-100"
              onClick={() => rooms.refetch()}
            >
              <RefreshCcwIcon />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {rooms.data?.map((room) => (
                <SidebarMenuItem key={room.id}>
                  <SidebarMenuButton isActive={room.id === roomID} asChild>
                    <Link to="/rooms/$roomID" params={{ roomID: room.id }}>
                      <span className="text-muted-foreground">
                        <span className="text-foreground">{room.name}</span>{' '}
                        <span className="italic truncate">({room.id})</span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
