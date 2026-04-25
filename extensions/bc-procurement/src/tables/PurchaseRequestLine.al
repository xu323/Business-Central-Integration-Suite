// =====================================================================
//  Table: Purchase Request Line
//  ID: 50101
//  Description: Line item belonging to a Purchase Request Header.
// =====================================================================
table 50101 "Purchase Request Line"
{
    Caption = 'Purchase Request Line';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Document No."; Code[20])
        {
            Caption = 'Document No.';
            TableRelation = "Purchase Request Header"."No.";
            NotBlank = true;
        }
        field(2; "Line No."; Integer)
        {
            Caption = 'Line No.';
        }
        field(10; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            TableRelation = Item."No.";
        }
        field(15; "Description"; Text[100])
        {
            Caption = 'Description';
        }
        field(20; "Quantity"; Decimal)
        {
            Caption = 'Quantity';
            DecimalPlaces = 0 : 5;
            MinValue = 0;
        }
        field(25; "Unit of Measure"; Code[10])
        {
            Caption = 'Unit of Measure';
        }
        field(30; "Unit Price"; Decimal)
        {
            Caption = 'Unit Price';
            DecimalPlaces = 2 : 5;
            MinValue = 0;
        }
        field(35; "Line Amount"; Decimal)
        {
            Caption = 'Line Amount';
            Editable = false;
            DecimalPlaces = 2 : 2;
        }
    }

    keys
    {
        key(PK; "Document No.", "Line No.") { Clustered = true; }
    }

    trigger OnInsert()
    begin
        UpdateLineAmount();
    end;

    trigger OnModify()
    begin
        UpdateLineAmount();
    end;

    trigger OnDelete()
    var
        Header: Record "Purchase Request Header";
    begin
        if Header.Get("Document No.") then
            Header.RecalcTotal();
    end;

    local procedure UpdateLineAmount()
    var
        Header: Record "Purchase Request Header";
    begin
        "Line Amount" := Round(Quantity * "Unit Price", 0.01);
        if Header.Get("Document No.") then
            Header.RecalcTotal();
    end;
}
