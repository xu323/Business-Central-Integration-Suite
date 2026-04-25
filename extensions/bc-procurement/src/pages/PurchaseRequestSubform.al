// =====================================================================
//  Page: Purchase Request Subform
//  ID: 50102
//  Type: ListPart (used by Purchase Request Card)
// =====================================================================
page 50102 "Purchase Request Subform"
{
    Caption = 'Purchase Request Lines';
    PageType = ListPart;
    SourceTable = "Purchase Request Line";
    AutoSplitKey = true;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field("Item No."; Rec."Item No.") { ApplicationArea = All; }
                field("Description"; Rec.Description) { ApplicationArea = All; }
                field("Quantity"; Rec.Quantity) { ApplicationArea = All; }
                field("Unit of Measure"; Rec."Unit of Measure") { ApplicationArea = All; }
                field("Unit Price"; Rec."Unit Price") { ApplicationArea = All; }
                field("Line Amount"; Rec."Line Amount") { ApplicationArea = All; }
            }
        }
    }
}
