// =====================================================================
//  Page: Purchase Request List
//  ID: 50100
//  Type: List
// =====================================================================
page 50100 "Purchase Request List"
{
    Caption = 'Purchase Requests';
    PageType = List;
    SourceTable = "Purchase Request Header";
    CardPageId = "Purchase Request Card";
    UsageCategory = Lists;
    ApplicationArea = All;
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field("No."; Rec."No.") { ApplicationArea = All; }
                field("Description"; Rec.Description) { ApplicationArea = All; }
                field("Requester"; Rec.Requester) { ApplicationArea = All; }
                field("Vendor No."; Rec."Vendor No.") { ApplicationArea = All; }
                field("Vendor Name"; Rec."Vendor Name") { ApplicationArea = All; }
                field("Total Amount"; Rec."Total Amount") { ApplicationArea = All; }
                field("Status"; Rec.Status)
                {
                    ApplicationArea = All;
                    StyleExpr = StatusStyle;
                }
                field("High Risk"; Rec."High Risk")
                {
                    ApplicationArea = All;
                    StyleExpr = HighRiskStyle;
                }
                field("Document Date"; Rec."Document Date") { ApplicationArea = All; }
                field("BC Document ID"; Rec."BC Document ID") { ApplicationArea = All; }
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

                trigger OnAction()
                var
                    ApprovalMgt: Codeunit "Approval Mgt.";
                begin
                    ApprovalMgt.Approve(Rec, '');
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

                trigger OnAction()
                var
                    ApprovalMgt: Codeunit "Approval Mgt.";
                    Comment: Text;
                begin
                    ApprovalMgt.Reject(Rec, Comment);
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
        StatusStyle: Text;
        HighRiskStyle: Text;

    trigger OnAfterGetRecord()
    begin
        case Rec.Status of
            Rec.Status::Draft:
                StatusStyle := 'Subordinate';
            Rec.Status::Submitted:
                StatusStyle := 'Ambiguous';
            Rec.Status::Approved:
                StatusStyle := 'Favorable';
            Rec.Status::Rejected:
                StatusStyle := 'Unfavorable';
            Rec.Status::Synced:
                StatusStyle := 'Strong';
        end;

        if Rec."High Risk" then
            HighRiskStyle := 'Attention'
        else
            HighRiskStyle := 'Standard';
    end;
}
