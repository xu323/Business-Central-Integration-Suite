// =====================================================================
//  Table: Purchase Request Header
//  ID: 50100
//  Description: Header record for an internal purchase request.
//               Mirrors the shape that will eventually flow into a
//               Microsoft.Purchases.Document."Purchase Header" (PO).
// =====================================================================
table 50100 "Purchase Request Header"
{
    Caption = 'Purchase Request Header';
    DataClassification = CustomerContent;
    LookupPageId = "Purchase Request List";
    DrillDownPageId = "Purchase Request List";

    fields
    {
        field(1; "No."; Code[20])
        {
            Caption = 'No.';
            NotBlank = true;
        }
        field(5; "Description"; Text[100])
        {
            Caption = 'Description';
        }
        field(10; "Requester"; Code[50])
        {
            Caption = 'Requester';
            TableRelation = User."User Name";
        }
        field(15; "Department"; Code[20])
        {
            Caption = 'Department';
        }
        field(20; "Vendor No."; Code[20])
        {
            Caption = 'Vendor No.';
            TableRelation = Vendor."No.";
        }
        field(25; "Vendor Name"; Text[100])
        {
            Caption = 'Vendor Name';
            FieldClass = FlowField;
            CalcFormula = lookup(Vendor.Name where("No." = field("Vendor No.")));
            Editable = false;
        }
        field(30; "Document Date"; Date)
        {
            Caption = 'Document Date';
        }
        field(35; "Required Date"; Date)
        {
            Caption = 'Required Date';
        }
        field(40; "Status"; Enum "Purchase Request Status")
        {
            Caption = 'Status';
            Editable = false;
        }
        field(45; "Total Amount"; Decimal)
        {
            Caption = 'Total Amount';
            Editable = false;
            DecimalPlaces = 2 : 2;
        }
        field(50; "High Risk"; Boolean)
        {
            Caption = 'High Risk';
            Editable = false;
        }
        field(55; "Currency Code"; Code[10])
        {
            Caption = 'Currency Code';
            TableRelation = Currency.Code;
        }
        field(60; "Approver"; Code[50])
        {
            Caption = 'Approver';
            TableRelation = User."User Name";
        }
        field(65; "Approval Comment"; Text[250])
        {
            Caption = 'Approval Comment';
        }
        field(70; "Submitted At"; DateTime)
        {
            Caption = 'Submitted At';
            Editable = false;
        }
        field(75; "Decided At"; DateTime)
        {
            Caption = 'Decided At';
            Editable = false;
        }
        field(80; "BC Document ID"; Text[50])
        {
            Caption = 'BC Document ID';
            Editable = false;
        }
        field(85; "Synced At"; DateTime)
        {
            Caption = 'Synced At';
            Editable = false;
        }
    }

    keys
    {
        key(PK; "No.") { Clustered = true; }
        key(StatusKey; "Status", "Document Date") { }
    }

    fieldgroups
    {
        fieldgroup(DropDown; "No.", "Description", "Status", "Total Amount") { }
        fieldgroup(Brick; "No.", "Description", "Vendor No.", "Status") { }
    }

    trigger OnInsert()
    begin
        if "No." = '' then
            "No." := GenerateNo();
        if "Document Date" = 0D then
            "Document Date" := WorkDate();
        if "Status" = "Status"::Draft then
            "Requester" := CopyStr(UserId(), 1, MaxStrLen("Requester"));
    end;

    trigger OnDelete()
    var
        Line: Record "Purchase Request Line";
    begin
        // Cascade delete child lines.
        Line.SetRange("Document No.", "No.");
        Line.DeleteAll(true);
    end;

    /// <summary>
    /// Generate the next No. using a simple "PR" + yyyymmdd + sequence pattern.
    /// In production this would read from a No. Series.
    /// </summary>
    local procedure GenerateNo(): Code[20]
    var
        Header: Record "Purchase Request Header";
        DateText: Text;
        Seq: Integer;
    begin
        DateText := Format(Today(), 0, '<Year4><Month,2><Day,2>');
        Header.SetFilter("No.", 'PR' + DateText + '*');
        if Header.FindLast() then
            Evaluate(Seq, CopyStr(Header."No.", 11));
        Seq += 1;
        exit('PR' + DateText + Format(Seq, 4, '<Integer,4><Filler Character,0>'));
    end;

    /// <summary>
    /// Recalculate Total Amount from the related lines and refresh High Risk flag.
    /// Called by the Approval Mgt. codeunit when a line is added/changed.
    /// </summary>
    procedure RecalcTotal()
    var
        Line: Record "Purchase Request Line";
        Total: Decimal;
        HighRiskThreshold: Decimal;
    begin
        Line.SetRange("Document No.", "No.");
        if Line.FindSet() then
            repeat
                Total += Line."Line Amount";
            until Line.Next() = 0;
        "Total Amount" := Total;

        // Threshold mirrors backend HIGH_RISK_THRESHOLD env var.
        HighRiskThreshold := 100000;
        "High Risk" := Total >= HighRiskThreshold;
        Modify(true);
    end;
}
