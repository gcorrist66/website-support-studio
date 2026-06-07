# Tenant Model

## Core Tenant Hierarchy

### Foundational Structure

**Agency → Client → Site → Ticket**

- **Agency**: A business operator providing managed website support services.
- **Client**: A customer account managed by an agency.
- **Site**: One or more web properties belonging to a client.
- **Ticket**: A support request lifecycle record for a specific site.

## Isolation Principles

- A Ticket always belongs to a single Site.
- A Site always belongs to a single Client.
- A Client always belongs to a single Agency.
- All operational permissions and reporting should follow this containment model.

## Corriston Consulting Example Tenant

```text
Corriston Consulting
└── Clients / Portfolio
    ├── Website Operations Desk
    ├── Campaign Budget Optimizer
    ├── ConversionHealth
    ├── IntrynSync
    └── Future Sites
```

### Notes on example
- `Website Operations Desk`, `Campaign Budget Optimizer`, `ConversionHealth`, and `IntrynSync` are example **Sites** in this model.
- `Future Sites` is an explicit placeholder for expansion.
- Example is used for taxonomy validation only and does not imply ownership or ownership rights beyond tenant modeling.

## Multi-Tenant Readiness Principles

- Keep hierarchy explicit and enforced at every process transition.
- Avoid cross-site leakage in ticket routing or role definitions.
- Ensure every future tenant and site can be added without changing the core hierarchy.
- Keep IDs and naming metadata deterministic and documented before implementation begins.
