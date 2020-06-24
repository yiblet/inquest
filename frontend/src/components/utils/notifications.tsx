import React, { useState, useEffect, createContext, useContext } from "react";
import { Observable } from "../../utils/observable";
import { OrderedMap } from "../../utils/collections";

const Card: React.FC = ({ children }) => (
    <div className="w-64 rounded overflow-hidden shadow hover:opacity-50">
        <div className="bg-yellow-600 h-1"></div>
        <div className="bg-gray-200 p-2 px-4">{children}</div>
    </div>
);

export type Notification = NonNullable<React.ReactChild>;
type NotificationData = {
    notification: Notification;
    timeout: number;
};

const NotificationContext = createContext<Observable<Notification>>(
    new Observable()
);

export const NotificationProvider = NotificationContext.Provider;

export const useNotifications: () => Observable<Notification> = () =>
    useContext(NotificationContext);

export const Notifications: React.FC<{
    timeout?: number;
}> = ({ timeout }) => {
    const notifactions = React.useContext(NotificationContext);
    const [pendingNotifications, setPendingNotifications] = useState<
        OrderedMap<number, NotificationData>
    >(OrderedMap());

    // listen to incoming Notificationsn
    useEffect(() => {
        const observer = (notification: Notification, order: number) => {
            const newTimeout = timeout || 5000;
            setPendingNotifications((pendingNotifications) =>
                pendingNotifications.set(order, {
                    notification,
                    timeout: newTimeout,
                })
            );
            setTimeout(
                () =>
                    setPendingNotifications((notifactions) =>
                        notifactions.remove(order)
                    ),
                newTimeout
            );
        };
        notifactions.attach(observer);
        return () => notifactions.detach(observer);
    }, [setPendingNotifications]);

    return (
        <div className="absolute top-0 right-0 mr-4 mt-4">
            {pendingNotifications.toArray().map(([key, notifaction]) => (
                <div
                    key={key}
                    onClick={(_) =>
                        setPendingNotifications((notifications) =>
                            notifications.remove(key)
                        )
                    }
                    className="mb-4"
                >
                    <Card>{notifaction.notification}</Card>
                </div>
            ))}
        </div>
    );
};
