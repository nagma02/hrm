export function isEmployeePortalPath(pathname = window.location.pathname) {
  return pathname.startsWith('/employee/') || pathname === '/employee'
}
