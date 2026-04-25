// =====================================================================
//  Codeunit: Approval Mgt.
//  ID: 50100
//  Responsibility: Manage the Draft → Submitted → Approved/Rejected
//                  → Synced state machine for Purchase Requests.
// =====================================================================
codeunit 50100 "Approval Mgt."
{
    Permissions = tabledata "Purchase Request Header" = rimd;

    var
        ErrCannotSubmitNonDraft: Label 'Only Draft requests can be submitted (current status: %1).', Comment = '%1 = current status';
        ErrCannotDecideNonSubmitted: Label 'Only Submitted requests can be approved or rejected (current status: %1).', Comment = '%1 = current status';
        ErrEmptyLines: Label 'Cannot submit a request with no lines.';
        InfoSubmitted: Label 'Request %1 submitted for approval.', Comment = '%1 = request number';
        InfoApproved: Label 'Request %1 approved.', Comment = '%1 = request number';
        InfoRejected: Label 'Request %1 rejected.', Comment = '%1 = request number';
        HighRiskThreshold: Decimal;

    /// <summary>
    /// Submit a Draft request for approval.
    /// Recalculates Total Amount and High Risk flag, then transitions
    /// the status to Submitted.
    /// </summary>
    procedure SubmitForApproval(var Header: Record "Purchase Request Header")
    var
        Line: Record "Purchase Request Line";
    begin
        if Header.Status <> Header.Status::Draft then
            Error(ErrCannotSubmitNonDraft, Header.Status);

        Line.SetRange("Document No.", Header."No.");
        if Line.IsEmpty() then
            Error(ErrEmptyLines);

        Header.RecalcTotal();
        Header.Status := Header.Status::Submitted;
        Header."Submitted At" := CurrentDateTime();
        Header.Modify(true);

        OnAfterSubmitForApproval(Header);
        Message(InfoSubmitted, Header."No.");
    end;

    /// <summary>
    /// Approve a Submitted request.
    /// </summary>
    procedure Approve(var Header: Record "Purchase Request Header"; Comment: Text[250])
    begin
        if Header.Status <> Header.Status::Submitted then
            Error(ErrCannotDecideNonSubmitted, Header.Status);

        Header.Status := Header.Status::Approved;
        Header."Decided At" := CurrentDateTime();
        Header.Approver := CopyStr(UserId(), 1, MaxStrLen(Header.Approver));
        Header."Approval Comment" := Comment;
        Header.Modify(true);

        OnAfterApprove(Header);
        Message(InfoApproved, Header."No.");
    end;

    /// <summary>
    /// Reject a Submitted request.
    /// </summary>
    procedure Reject(var Header: Record "Purchase Request Header"; Comment: Text[250])
    begin
        if Header.Status <> Header.Status::Submitted then
            Error(ErrCannotDecideNonSubmitted, Header.Status);

        Header.Status := Header.Status::Rejected;
        Header."Decided At" := CurrentDateTime();
        Header.Approver := CopyStr(UserId(), 1, MaxStrLen(Header.Approver));
        Header."Approval Comment" := Comment;
        Header.Modify(true);

        OnAfterReject(Header);
        Message(InfoRejected, Header."No.");
    end;

    /// <summary>
    /// Returns true when the supplied amount qualifies as a high-risk approval.
    /// Mirrors backend HIGH_RISK_THRESHOLD env var.
    /// </summary>
    procedure IsHighRisk(Amount: Decimal): Boolean
    begin
        if HighRiskThreshold = 0 then
            HighRiskThreshold := 100000;
        exit(Amount >= HighRiskThreshold);
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterSubmitForApproval(var Header: Record "Purchase Request Header")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterApprove(var Header: Record "Purchase Request Header")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterReject(var Header: Record "Purchase Request Header")
    begin
    end;
}
