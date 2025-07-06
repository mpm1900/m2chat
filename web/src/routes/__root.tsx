import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface MyRouterContext {
  queryClient: QueryClient
}

const ROUTER_DEVTOOLS_ENABLED = false
const QUERY_DEVTOOLS_ENABLED = false

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />

      {ROUTER_DEVTOOLS_ENABLED && <TanStackRouterDevtools />}
      {QUERY_DEVTOOLS_ENABLED && (
        <ReactQueryDevtools buttonPosition="bottom-right" />
      )}
    </>
  ),
})
