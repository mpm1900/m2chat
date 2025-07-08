import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { EditIcon, SendIcon } from 'lucide-react'
import { v4 } from 'uuid'
import { Button } from '~/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '~/components/ui/sidebar'
import { Textarea } from '~/components/ui/textarea'
import { useRoom } from '~/hooks/use-room'
import {
  roomConnectionActions,
  useRoomConnection,
  useRoomEvent,
} from '~/hooks/use-room-connection'
import { cn } from '~/lib/utils'
import type { SystemMessage } from '~/types/message'

export const Route = createFileRoute('/rooms/$roomID')({
  component: RouteComponent,
  onEnter: (route) => {
    roomConnectionActions.connect(route.params.roomID)
  },
  onLeave: () => {
    roomConnectionActions.disconnect()
  },
})

function RouteComponent() {
  const { roomID } = Route.useParams()
  const log = useRoomConnection((state) => state.messageLog)
  const conn = useRoomConnection((state) => state.conn)
  const send = useRoomConnection((state) => state.send)
  const client = useRoomConnection((state) => state.client)
  const room = useRoom(roomID)
  const queryClient = useQueryClient()

  useRoomEvent(['*'], (message) => {
    console.log('received message', message)
    queryClient.removeQueries({
      predicate: (query) => {
        const base = String(query.queryKey[0])
        const system = message as SystemMessage
        const idMatch =
          query.queryKey.length > -1 && query.queryKey[1] === message.roomID
        return !!system.refetch?.includes(base) && idMatch
      },
    })
  })

  return (
    <div className="flex flex-col h-full max-h-svh">
      <div className="border-b px-6 py-2 flex flex-row items-center justify-between gap-2">
        <div className="flex flex-row items-center gap-2">
          <div className="font-semibold whitespace-nowrap">
            {room.data?.name}
          </div>
          <div
            className={cn('bg-muted rounded-full size-2', {
              'bg-green-700': conn,
            })}
          />
          <div className="italic text-sm text-muted-foreground truncate">
            ({room.data?.id})
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button variant="ghost" size="icon">
            <EditIcon />
          </Button>
        </div>
      </div>
      <SidebarProvider className="flex flex-row flex-1 justify-between relative min-h-0">
        <SidebarInset className="p-2 flex-1 flex">
          <div className="h-full flex flex-col gap-6 justify-between">
            <div className="flex flex-col gap-2 overflow-y-auto p-4">
              {log
                .filter((m) => m.type === 'chat')
                .map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex flex-col pr-8 pl-0', {
                      'items-end pl-8 pr-0': client?.id === m.clientID,
                    })}
                  >
                    <div
                      className={cn(
                        'flex flex-row items-center gap-2 leading-none',
                        { 'flex-row-reverse': client?.id === m.clientID },
                      )}
                    >
                      <div className="text-muted-foreground text-sm">
                        {m.clientID}
                      </div>
                      {m.timestamp && (
                        <div className="text-xs">
                          ({format(m.timestamp, 'h:mm a')})
                        </div>
                      )}
                    </div>
                    <div className="text-lg">{m.text}</div>
                  </div>
                ))}
            </div>
            <div className="px-4 pb-2">
              <form
                className="relative w-full"
                onSubmit={(e: any) => {
                  e.preventDefault()
                  const text = e.currentTarget.text.value
                  e.currentTarget.reset()
                  send({
                    id: v4(),
                    type: 'chat',
                    roomID,
                    text,
                  })
                }}
              >
                <Textarea
                  name="text"
                  placeholder="Type a message..."
                  className="resize-none"
                  onKeyDown={(e) => {
                    const form = e.currentTarget.form
                    if (!form) return

                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      form.requestSubmit()
                    }
                  }}
                />

                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="resize-none absolute right-1 bottom-1 opacity-60 hover:opacity-100"
                >
                  <SendIcon />
                </Button>
              </form>
            </div>
          </div>
        </SidebarInset>
        <Sidebar side="right" className="border-l absolute h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                Clients ({room.data?.clients.length})
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {room.data?.clients.map((c) => (
                    <SidebarMenuItem key={c.id}>
                      <SidebarMenuButton>
                        <div className="inline-flex flex-row items-center gap-2 truncate">
                          {c.id === client?.id && (
                            <span className="text-xs font-black text-muted-foreground">
                              (YOU)
                            </span>
                          )}
                          <span className="truncate">{c.id}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  )
}
