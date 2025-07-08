import { Link, useParams } from '@tanstack/react-router'
import {
  BotMessageSquareIcon,
  ChevronsUpDownIcon,
  RefreshCcwIcon,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useRooms } from '~/hooks/use-rooms'
import { useUser } from '~/hooks/use-user'

export function RoomsSidebar() {
  const user = useUser()
  const rooms = useRooms()
  const { roomID } = useParams({ strict: false })

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/rooms">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <BotMessageSquareIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">m2chat</span>
                  <span className="text-muted-foreground">dev</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name || 'NO_NAME'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.id}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
