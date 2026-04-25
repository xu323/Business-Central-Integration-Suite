// =====================================================================
//  Page: Purchase Request Card
//  ID: 50101
//  Type: Card
// =====================================================================
page 50101 "Purchase Request Card"
{
    Caption = 'Purchase Request';
    PageType = Card;
    SourceTable = "Purchase Request Header";
    UsageCategory = None;
    ApplicationArea = All;

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';

                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                    Editable = NoIsEditable;
                }
                field("Description"; Rec.Description) { ApplicationArea = All; }
                field("Requester"; Rec.Requester) { ApplicationArea = All; }
                field("Department"; Rec.Department) { ApplicationArea = All; }
                field("Document Date"; Rec."Document Date") { ApplicationArea = All; }
                field("Required Date"; Rec."Required Date") { ApplicationArea = All; }
                field("Currency Code"; Rec."Currency Code") { ApplicationArea = All; }
            }

            group(Vendor)
            {
                Caption = 'Vendor';

                field("Vendor No."; Rec."Vendor No.") { ApplicationArea = All; }
                field("Vendor Name"; Rec."Vendor Name") { ApplicationArea = All; }
            }

            part(Lines; "Purchase Request Subform")
            {
                Caption = 'Lines';
                ApplicationArea = All;
                SubPageLink = "Document No." = field("No.");
                UpdatePropagation = Both;
            }

            group(Approval)
            {
                Caption = 'Approval';

                field("Status"; Rec.Status) { ApplicationArea = All; }
                field("Total Amount"; Rec."Total Amount") { ApplicationArea = All; }
                field("High Risk"; Rec."High Risk") { ApplicationArea = All; }
                field("Submitted At"; Rec."Submitted At") { ApplicationArea = All; }
                field("Approver"; Rec.Approver) { ApplicationArea = All; }
                field("Decided At"; Rec."Decided At") { ApplicationArea = All; }
                field("Approval Comment"; Rec."Approval Comment") { ApplicationArea = All; }
            }

            group(Sync)
            {
                Caption = 'Business Central Sync';

                field("BC Document ID"; Rec."BC Document ID") { ApplicationArea = All; }
                field("Synced At"; Rec."Synced At") { ApplicationArea = All; }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(Submit)
            {
                Caption = 'Submit for Approval';
                Image = SendApprovalRequest;
                ApplicationArea = All;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = (Rec.Status = Rec.Status::Draft);

                trigger OnAction()
                var
                    ApprovalMgt: Codeunit "Approval Mgt.";
                begin
                    ApprovalMgt.SubmitForApproval(Rec);
                    CurrPage.Update(false);
                end;
            }
            action(Approve)
            {
                Caption = 'Approve';
                Image = Approve;
                ApplicationArea = All;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = (Rec.Status = Rec.Status::Submitted);

                trigger OnAction()
                var
                    ApprovalMgt: Codeunit "Approval Mgt.";
                begin
                    ApprovalMgt.Approve(Rec, Rec."Approval Comment");
                    CurrPage.Update(false);
                end;
            }
            action(Reject)
            {
                Caption = 'Reject';
                Image = Reject;
                ApplicationArea = All;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = (Rec.Status = Rec.Status::Submitted);

                trigger OnAction()
                var
                    ApprovalMgt: Codeunit "Approval Mgt.";
                begin
                    ApprovalMgt.Reject(Rec, Rec."Approval Comment");
                    CurrPage.Update(false);
                end;
            }
            action(SyncToBC)
            {
                Caption = 'Sync to Business Central';
                Image = Refresh;
                ApplicationArea = All;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = (Rec.Status = Rec.Status::Approved);

                trigger OnAction()
                var
                    SyncMgt: Codeunit "BC Sync Mgt.";
                begin
                    SyncMgt.SyncRequestToPurchaseOrder(Rec);
                    CurrPage.Update(false);
                end;
            }
        }
    }

    var
        NoIsEditable: Boolean;

    trigger OnNewRecord(BelowxRec: Boolean)
    begin
        NoIsEditable := true;
    end;

    trigger OnAfterGetRecord()
    begin
        NoIsEditable := Rec."No." = '';
    end;
}
