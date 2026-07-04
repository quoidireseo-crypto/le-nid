export function notificationsSupportees() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permissionNotifications() {
  return notificationsSupportees() ? Notification.permission : 'unsupported'
}

export async function demanderPermission() {
  if (!notificationsSupportees()) return 'unsupported'
  return await Notification.requestPermission()
}

export function notifier(titre, corps) {
  if (!notificationsSupportees() || Notification.permission !== 'granted') return
  try {
    new Notification(titre, { body: corps })
  } catch {
    // Certains navigateurs mobiles refusent silencieusement — sans conséquence.
  }
}
