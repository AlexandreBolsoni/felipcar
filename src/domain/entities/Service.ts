export type DurationUnit = 'minutes' | 'hours' | 'days';
export type PriceType = 'fixed' | 'variable';

export class Service {
    private _id: string;
    private _title: string;
    private _description: string;
    private _durationValue: number;
    private _durationUnit: DurationUnit;
    private _durationMinutes: number;
    private _price: number;
    private _priceType: PriceType;

    // Advanced / Detailed View Properties
    private _hasDetailedView: boolean;
    private _detailedDescription: string;
    private _detailedImages: string[];
    private _additionalInfo: string;

    constructor(
        id: string, 
        title: string, 
        description: string, 
        durationValue: number, 
        price: number,
        durationUnit: DurationUnit = 'minutes',
        priceType: PriceType = 'fixed',
        hasDetailedView: boolean = false,
        detailedDescription: string = '',
        detailedImages: string[] = [],
        additionalInfo: string = ''
    ) {
        this._id = id;
        this._title = title;
        this._description = description;
        this._durationValue = durationValue > 0 ? durationValue : 60;
        this._durationUnit = durationUnit;
        this._durationMinutes = Service.calculateDurationMinutes(this._durationValue, this._durationUnit);
        this._price = price >= 0 ? price : 0;
        this._priceType = priceType;

        this._hasDetailedView = hasDetailedView;
        this._detailedDescription = detailedDescription;
        this._detailedImages = detailedImages;
        this._additionalInfo = additionalInfo;
    }

    public static calculateDurationMinutes(val: number, unit: DurationUnit): number {
        if (unit === 'hours') return val * 60;
        if (unit === 'days') return val * 600; // 10 operating hours/day (08:00 - 18:00)
        return val;
    }

    public get id(): string { return this._id; }
    public get title(): string { return this._title; }
    public set title(value: string) { this._title = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    public get durationValue(): number { return this._durationValue; }
    public set durationValue(value: number) {
        if (value <= 0) throw new Error("A duração deve ser maior que zero");
        this._durationValue = value;
        this._durationMinutes = Service.calculateDurationMinutes(this._durationValue, this._durationUnit);
    }

    public get durationUnit(): DurationUnit { return this._durationUnit; }
    public set durationUnit(value: DurationUnit) {
        this._durationUnit = value;
        this._durationMinutes = Service.calculateDurationMinutes(this._durationValue, this._durationUnit);
    }

    public get durationMinutes(): number { return this._durationMinutes; }

    public get price(): number { return this._price; }
    public set price(value: number) {
        if (value < 0) throw new Error("O preço deve ser maior ou igual a zero");
        this._price = value;
    }

    public get priceType(): PriceType { return this._priceType; }
    public set priceType(value: PriceType) { this._priceType = value; }

    public get hasDetailedView(): boolean { return this._hasDetailedView; }
    public set hasDetailedView(value: boolean) { this._hasDetailedView = value; }

    public get detailedDescription(): string { return this._detailedDescription; }
    public set detailedDescription(value: string) { this._detailedDescription = value; }

    public get detailedImages(): string[] { return this._detailedImages; }
    public set detailedImages(value: string[]) { this._detailedImages = value; }

    public get additionalInfo(): string { return this._additionalInfo; }
    public set additionalInfo(value: string) { this._additionalInfo = value; }

    public getFormattedDuration(): string {
        if (this._durationUnit === 'days') {
            return `${this._durationValue} ${this._durationValue === 1 ? 'dia' : 'dias'}`;
        }
        if (this._durationUnit === 'hours') {
            return `${this._durationValue} ${this._durationValue === 1 ? 'hora' : 'horas'}`;
        }
        return `${this._durationValue} min`;
    }

    public getFormattedPrice(): string {
        const formattedPrice = `R$ ${this._price.toFixed(2)}`;
        if (this._priceType === 'variable') {
            return `A partir de ${formattedPrice}`;
        }
        return formattedPrice;
    }
}

