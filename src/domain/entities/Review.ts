export class Review {
    private _id: string;
    private _authorName: string;
    private _carModel: string;
    private _rating: number; // 1 to 5
    private _comment: string;
    private _date: string;
    private _hidden: boolean;
    private _ownerReply: string | null;

    constructor(
        id: string,
        authorName: string,
        carModel: string,
        rating: number,
        comment: string,
        date: string,
        hidden: boolean = false,
        ownerReply: string | null = null
    ) {
        this._id = id;
        this._authorName = authorName;
        this._carModel = carModel;
        this._rating = rating >= 1 && rating <= 5 ? rating : 5;
        this._comment = comment;
        this._date = date;
        this._hidden = hidden;
        this._ownerReply = ownerReply;
    }

    public get id(): string { return this._id; }
    public get authorName(): string { return this._authorName; }
    public set authorName(val: string) { this._authorName = val; }

    public get carModel(): string { return this._carModel; }
    public set carModel(val: string) { this._carModel = val; }

    public get rating(): number { return this._rating; }
    public set rating(val: number) { this._rating = val; }

    public get comment(): string { return this._comment; }
    public set comment(val: string) { this._comment = val; }

    public get date(): string { return this._date; }

    public get hidden(): boolean { return this._hidden; }
    public set hidden(val: boolean) { this._hidden = val; }

    public get ownerReply(): string | null { return this._ownerReply; }
    public set ownerReply(val: string | null) { this._ownerReply = val; }

    public toJSON() {
        return {
            id: this._id,
            authorName: this._authorName,
            carModel: this._carModel,
            rating: this._rating,
            comment: this._comment,
            date: this._date,
            hidden: this._hidden,
            ownerReply: this._ownerReply
        };
    }
}
