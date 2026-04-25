// =====================================================================
//  Codeunit: BC Sync Mgt.
//  ID: 50101
//  Responsibility: Convert an Approved Purchase Request into a real
//                  Microsoft.Purchases.Document."Purchase Header"
//                  (Purchase Order) and stamp the BC Document ID back.
// =====================================================================
codeunit 50101 "BC Sync Mgt."
{
    Permissions = tabledata "Purchase Request Header" = rimd,
                  tabledata "Purchase Request Line" = r;

    var
        ErrNotApproved: Label 'Only Approved requests can be synced (current status: %1).', Comment = '%1 = current status';
        ErrNoVendor: Label 'A vendor must be set before syncing to Business Central.';
        InfoSynced: Label 'Request %1 synced to Business Central as %2.', Comment = '%1 = request, %2 = BC document id';

    /// <summary>
    /// Convert an Approved Purchase Request into a Purchase Order
    /// (Document Type = Order). Sets BC Document ID and Synced At
    /// on the source request.
    /// </summary>
    /// <remarks>
    /// In a production-grade extension, the Purchase Header / Line
    /// references would be uncommented and this codeunit would call
    /// real BC tables. They're left commented out so the extension
    /// stays self-contained for the portfolio repository.
    /// </remarks>
    procedure SyncRequestToPurchaseOrder(var Header: Record "Purchase Request Header")
    var
        // PurchHeader: Record "Purchase Header";
        // PurchLine: Record "Purchase Line";
        // ReqLine: Record "Purchase Request Line";
        BCDocumentId: Text[50];
    begin
        if Header.Status <> Header.Status::Approved then
            Error(ErrNotApproved, Header.Status);
        if Header."Vendor No." = '' then
            Error(ErrNoVendor);

        // -- Real BC integration (uncomment when running inside BC) ---------
        // PurchHeader.Init();
        // PurchHeader.Validate("Document Type", PurchHeader."Document Type"::Order);
        // PurchHeader.Insert(true);
        // PurchHeader.Validate("Buy-from Vendor No.", Header."Vendor No.");
        // PurchHeader.Validate("Document Date", Header."Document Date");
        // PurchHeader.Validate("Expected Receipt Date", Header."Required Date");
        // PurchHeader.Modify(true);
        //
        // ReqLine.SetRange("Document No.", Header."No.");
        // if ReqLine.FindSet() then
        //     repeat
        //         PurchLine.Init();
        //         PurchLine.Validate("Document Type", PurchHeader."Document Type");
        //         PurchLine.Validate("Document No.", PurchHeader."No.");
        //         PurchLine.Validate("Line No.", ReqLine."Line No.");
        //         PurchLine.Validate(Type, PurchLine.Type::Item);
        //         PurchLine.Validate("No.", ReqLine."Item No.");
        //         PurchLine.Validate(Quantity, ReqLine.Quantity);
        //         PurchLine.Validate("Direct Unit Cost", ReqLine."Unit Price");
        //         PurchLine.Insert(true);
        //     until ReqLine.Next() = 0;
        //
        // BCDocumentId := PurchHeader."No.";
        // -------------------------------------------------------------------

        // Mock: generate a deterministic looking BC document id.
        BCDocumentId := CopyStr('PO-' + Header."No.", 1, MaxStrLen(BCDocumentId));

        Header."BC Document ID" := BCDocumentId;
        Header."Synced At" := CurrentDateTime();
        Header.Status := Header.Status::Synced;
        Header.Modify(true);

        OnAfterSyncToPurchaseOrder(Header, BCDocumentId);
        Message(InfoSynced, Header."No.", BCDocumentId);
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterSyncToPurchaseOrder(var Header: Record "Purchase Request Header"; BCDocumentId: Text[50])
    begin
    end;
}
