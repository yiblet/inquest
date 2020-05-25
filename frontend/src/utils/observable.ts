import { OrderedSet } from "./collections";

export type Observer<T> = (value: T, order: number) => any;

/**
 * A simplistic observer class
 */
export class Observable<T> {
    private observers: OrderedSet<Observer<T>> = OrderedSet();
    private order = 0;

    public attach(observer: Observer<T>) {
        this.observers = this.observers.add(observer);
    }

    public detach(observer: Observer<T>) {
        this.observers = this.observers.remove(observer);
    }

    public notify(value: T) {
        this.observers.forEach((obv) => obv(value, this.order));
        this.order++;
    }
}
