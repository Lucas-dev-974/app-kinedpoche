import { createSignal } from "solid-js";

export type NotificationType = {
  id: number;
  content: string;
  type: "error" | "info";
};

export const [notifications, setNotifications] = createSignal<
  NotificationType[]
>([]);

// Compteur monotone module-level : l'ancien `lastId` calculé hors de l'updater
// donnait le MÊME id à deux push dans le même tick (remove fermait alors la
// mauvaise notification, audit 🟡).
let lastNotificationId = 0;

export class NotificationService {
  static push(notifi: Partial<NotificationType>) {
    const newId = ++lastNotificationId;

    setNotifications((prev) => {
      if (!prev) return prev;

      const newnotif = [
        ...prev,
        {
          id: newId,
          ...(notifi as Pick<NotificationType, "content" | "type">),
        } as NotificationType,
      ];

      return newnotif;
    });
  }

  /**
   * Retire une notification par son ID
   */
  static remove(id: number) {
    setNotifications((prev) => {
      if (!prev) return prev;
      return prev.filter((notif) => notif.id !== id);
    });
  }

  /**
   * Retire toutes les notifications
   */
  static clear() {
    setNotifications([]);
  }

  /**
   * Retire toutes les notifications d'erreur
   */
  static clearErrors() {
    setNotifications((prev) => {
      if (!prev) return prev;
      return prev.filter((notif) => notif.type !== "error");
    });
  }
}
