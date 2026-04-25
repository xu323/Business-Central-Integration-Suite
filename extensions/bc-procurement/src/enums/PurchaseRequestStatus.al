// =====================================================================
//  Enum: Purchase Request Status
//  Object Range: 50100–50199 (Per Tenant Extension)
//  Lifecycle: Draft → Submitted → Approved → Rejected → Synced
// =====================================================================
enum 50100 "Purchase Request Status"
{
    Extensible = true;
    Caption = 'Purchase Request Status';

    value(0; Draft)
    {
        Caption = 'Draft';
    }
    value(10; Submitted)
    {
        Caption = 'Submitted';
    }
    value(20; Approved)
    {
        Caption = 'Approved';
    }
    value(30; Rejected)
    {
        Caption = 'Rejected';
    }
    value(40; Synced)
    {
        Caption = 'Synced';
    }
}
