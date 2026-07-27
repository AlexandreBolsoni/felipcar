export type AppointmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export class Appointment {
    private _id: string;
    private _clientName: string;
    private _clientPhone: string;
    private _carModel: string;
    private _carPlate: string;
    private _serviceId: string;
    private _date: string; // YYYY-MM-DD
    private _hour: string; // HH:mm
    private _status: AppointmentStatus;

    constructor(id: string, clientName: string, clientPhone: string, carModel: string, carPlate: string, serviceId: string, date: string, hour: string, status: AppointmentStatus = 'PENDING') {
        this._id = id;
        this._clientName = clientName;
        this._clientPhone = clientPhone;
        this._carModel = carModel;
        this._carPlate = carPlate;
        this._serviceId = serviceId;
        this._date = date;
        this._hour = hour;
        this._status = status;
    }

    public get id() { return this._id; }
    public get clientName() { return this._clientName; }
    public get clientPhone() { return this._clientPhone; }
    public get carModel() { return this._carModel; }
    public get carPlate() { return this._carPlate; }
    public get serviceId() { return this._serviceId; }
    public get date() { return this._date; }
    public get hour() { return this._hour; }
    public get status() { return this._status; }

    public complete(): void {
        this._status = 'COMPLETED';
    }

    public cancel(): void {
        this._status = 'CANCELLED';
    }

    public postpone(newDate: string, newHour: string): void {
        this._date = newDate;
        this._hour = newHour;
        this._status = 'PENDING';
    }
}
