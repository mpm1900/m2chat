import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { EditIcon, SendIcon } from 'lucide-react'
import { v4 } from 'uuid'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
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
    queryClient.refetchQueries({
      predicate: (query) => {
        const base = String(query.queryKey[0])
        const system = message as SystemMessage
        return !!system.refetch?.includes(base)
      },
    })
  })

  return (
    <div className="flex flex-col h-full">
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
          <div className="italic text-muted-foreground truncate">
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
        <SidebarInset className="p-4 flex-1 flex">
          <Card className="h-full justify-between">
            <CardContent className="flex flex-col gap-2">
              {log
                .filter((m) => m.type === 'chat')
                .map((m) => (
                  <div key={m.id}>
                    <div
                      className={cn('flex flex-col', {
                        'items-end': client?.id === m.clientID,
                      })}
                    >
                      <div className="flex flex-row items-center gap-2 leading-none">
                        <div className="text-muted-foreground text-sm">
                          {m.clientID}
                        </div>
                        {m.timestamp && (
                          <div className="text-sm">
                            ({format(m.timestamp, 'h:mm a')})
                          </div>
                        )}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
            </CardContent>
            <CardFooter className="sticky bottom-0">
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
            </CardFooter>
          </Card>
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
                        {c.id === client?.id && (
                          <span className="truncate">(YOU) {c.id}</span>
                        )}
                        {c.id !== client?.id && (
                          <span className="truncate">{c.id}</span>
                        )}
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
