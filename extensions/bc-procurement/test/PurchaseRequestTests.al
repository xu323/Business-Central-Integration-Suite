// =====================================================================
//  Test Codeunit: Purchase Request Tests
//  ID: 50190
//  Pattern: GIVEN / WHEN / THEN
// =====================================================================
codeunit 50190 "Purchase Request Tests"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit "Library Assert";

    [Test]
    procedure CanSubmitDraftRequestWithLines()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Draft request with one line
        CreateRequestWithLine(Header, 'Office chair', 5, 1500);

        // WHEN submitting it
        ApprovalMgt.SubmitForApproval(Header);

        // THEN status should be Submitted and Total Amount populated
        Assert.AreEqual(Header.Status::Submitted, Header.Status, 'Status should be Submitted');
        Assert.AreEqual(7500, Header."Total Amount", 'Total Amount should equal qty * price');
        Assert.IsFalse(Header."High Risk", 'Below threshold should not be high risk');
    end;

    [Test]
    procedure HighRiskFlagSetWhenAmountExceedsThreshold()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Draft request with a large line
        CreateRequestWithLine(Header, 'Server rack', 1, 250000);

        // WHEN submitting it
        ApprovalMgt.SubmitForApproval(Header);

        // THEN High Risk flag should be true
        Assert.IsTrue(Header."High Risk", 'Amount over threshold should mark as high risk');
    end;

    [Test]
    procedure CannotSubmitWithoutLines()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Draft request with NO lines
        Header.Init();
        Header."No." := 'PR-TEST-EMPTY';
        Header.Description := 'Empty request';
        Header.Insert(true);

        // WHEN attempting to submit
        // THEN it should error
        asserterror ApprovalMgt.SubmitForApproval(Header);
    end;

    [Test]
    procedure CanApproveSubmittedRequest()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Submitted request
        CreateRequestWithLine(Header, 'Monitor', 2, 8000);
        ApprovalMgt.SubmitForApproval(Header);

        // WHEN approving
        ApprovalMgt.Approve(Header, 'Looks good.');

        // THEN status is Approved and approver/comment recorded
        Assert.AreEqual(Header.Status::Approved, Header.Status, 'Status should be Approved');
        Assert.AreNotEqual('', Header.Approver, 'Approver should be set');
    end;

    [Test]
    procedure CanRejectSubmittedRequest()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Submitted request
        CreateRequestWithLine(Header, 'Laptop', 1, 50000);
        ApprovalMgt.SubmitForApproval(Header);

        // WHEN rejecting
        ApprovalMgt.Reject(Header, 'Out of budget.');

        // THEN status is Rejected
        Assert.AreEqual(Header.Status::Rejected, Header.Status, 'Status should be Rejected');
    end;

    [Test]
    procedure CannotApproveDraftRequest()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
    begin
        // GIVEN a Draft request (not submitted)
        CreateRequestWithLine(Header, 'Cable', 10, 100);

        // WHEN attempting to approve
        // THEN it should error
        asserterror ApprovalMgt.Approve(Header, '');
    end;

    [Test]
    procedure CanSyncApprovedRequestToBC()
    var
        Header: Record "Purchase Request Header";
        ApprovalMgt: Codeunit "Approval Mgt.";
        SyncMgt: Codeunit "BC Sync Mgt.";
    begin
        // GIVEN an Approved request with vendor
        CreateRequestWithLine(Header, 'Printer', 1, 8000);
        Header."Vendor No." := 'V0001';
        Header.Modify(true);
        ApprovalMgt.SubmitForApproval(Header);
        ApprovalMgt.Approve(Header, '');

        // WHEN syncing to BC
        SyncMgt.SyncRequestToPurchaseOrder(Header);

        // THEN BC Document ID stamped and status = Synced
        Assert.AreNotEqual('', Header."BC Document ID", 'BC Document ID should be set');
        Assert.AreEqual(Header.Status::Synced, Header.Status, 'Status should be Synced');
    end;

    local procedure CreateRequestWithLine(var Header: Record "Purchase Request Header"; LineDesc: Text[100]; Qty: Decimal; UnitPrice: Decimal)
    var
        Line: Record "Purchase Request Line";
        DocNo: Code[20];
    begin
        DocNo := CopyStr('PR-T-' + Format(CreateGuid()).Substring(2, 6), 1, 20);
        Header.Init();
        Header."No." := DocNo;
        Header.Description := 'Test request';
        Header.Insert(true);

        Line.Init();
        Line."Document No." := DocNo;
        Line."Line No." := 10000;
        Line.Description := LineDesc;
        Line.Quantity := Qty;
        Line."Unit Price" := UnitPrice;
        Line.Insert(true);

        Header.Get(DocNo);
    end;
}
