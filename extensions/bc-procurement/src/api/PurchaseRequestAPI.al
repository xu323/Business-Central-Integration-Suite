// =====================================================================
//  Page (API): Purchase Request API
//  ID: 50180
//  URL: /api/xu323/integration/v1.0/companies({id})/purchaseRequests
// =====================================================================
page 50180 "Purchase Request API"
{
    PageType = API;
    APIPublisher = 'xu323';
    APIGroup = 'integration';
    APIVersion = 'v1.0';
    EntityName = 'purchaseRequest';
    EntitySetName = 'purchaseRequests';
    SourceTable = "Purchase Request Header";
    DelayedInsert = true;
    ODataKeyFields = SystemId;
    Caption = 'Purchase Request API';
    Extensible = false;

    layout
    {
        area(Content)
        {
            repeater(Group)
            {
                field(systemId; Rec.SystemId)
                {
                    Caption = 'systemId';
                    Editable = false;
                }
                field(number; Rec."No.") { Caption = 'number'; }
                field(description; Rec.Description) { Caption = 'description'; }
                field(requester; Rec.Requester) { Caption = 'requester'; }
                field(department; Rec.Department) { Caption = 'department'; }
                field(vendorNumber; Rec."Vendor No.") { Caption = 'vendorNumber'; }
                field(documentDate; Rec."Document Date") { Caption = 'documentDate'; }
                field(requiredDate; Rec."Required Date") { Caption = 'requiredDate'; }
                field(status; Rec.Status) { Caption = 'status'; }
                field(totalAmount; Rec."Total Amount")
                {
                    Caption = 'totalAmount';
                    Editable = false;
                }
                field(highRisk; Rec."High Risk")
                {
                    Caption = 'highRisk';
                    Editable = false;
                }
                field(currencyCode; Rec."Currency Code") { Caption = 'currencyCode'; }
                field(approver; Rec.Approver) { Caption = 'approver'; }
                field(approvalComment; Rec."Approval Comment") { Caption = 'approvalComment'; }
                field(submittedAt; Rec."Submitted At") { Caption = 'submittedAt'; }
                field(decidedAt; Rec."Decided At") { Caption = 'decidedAt'; }
                field(bcDocumentId; Rec."BC Document ID") { Caption = 'bcDocumentId'; }
                field(syncedAt; Rec."Synced At") { Caption = 'syncedAt'; }
                field(systemRowVersion; Rec.SystemRowVersion)
                {
                    Caption = 'systemRowVersion';
                    Editable = false;
                }
                field(lastModifiedDateTime; Rec.SystemModifiedAt)
                {
                    Caption = 'lastModifiedDateTime';
                    Editable = false;
                }
            }
        }
    }

    [ServiceEnabled]
    procedure submit(var ActionContext: WebServiceActionContext)
    var
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        ApprovalMgt.SubmitForApproval(Rec);
        SetActionResponse(ActionContext, Rec);
    end;

    [ServiceEnabled]
    procedure approve(var ActionContext: WebServiceActionContext)
    var
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        ApprovalMgt.Approve(Rec, Rec."Approval Comment");
        SetActionResponse(ActionContext, Rec);
    end;

    [ServiceEnabled]
    procedure reject(var ActionContext: WebServiceActionContext)
    var
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        ApprovalMgt.Reject(Rec, Rec."Approval Comment");
        SetActionResponse(ActionContext, Rec);
    end;

    [ServiceEnabled]
    procedure syncToBC(var ActionContext: WebServiceActionContext)
    var
        SyncMgt: Codeunit "BC Sync Mgt.";
    begin
        SyncMgt.SyncRequestToPurchaseOrder(Rec);
        SetActionResponse(ActionContext, Rec);
    end;

    local procedure SetActionResponse(var ActionContext: WebServiceActionContext; var Header: Record "Purchase Request Header")
    begin
        ActionContext.SetObjectType(ObjectType::Page);
        ActionContext.SetObjectId(Page::"Purchase Request API");
        ActionContext.AddEntityKey(Header.FieldNo(SystemId), Header.SystemId);
        ActionContext.SetResultCode(WebServiceActionResultCode::Updated);
    end;
}
