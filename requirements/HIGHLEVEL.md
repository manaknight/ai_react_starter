For my M &A Club, I'll describe the functionality, please write out my tech spec more clearly for me describing each page in detail what it does how it need to be laid out and route:
- There 3 portals: Member, Admin, Support
- all tables need filter search and pagination
- admin can do CRUD action for everything
- settings needed: stripe keys, escrow api key, jackpot amount, next date, 3 prizes, how many opportunities a member can see, monthly plan price, trigger jackpot draw, show coupon feature, affilate payment percentage
- support portal can answer support tickets and view/edit all the tables except settings and trigger jackpot
- Member can sign up for free can see every page but locked out of viewing details and add anything. We would show a button upgrade to join
- Member Pages are:
= Perks > Jackpot where there can see how much jackpot is and when the next draw is. They can also see the next 3 prizes. Free user cant submit entry to it. User must click button to be added to jackpot draw.
= Perks > Coupons where user can browse coupons to get codes. There 2 type of coupons: coupon with codes and coupon need to fill in form and admin can apply for coupon on user behalf
- Sponsors: companies who offer special deals for our members so we show their logo, name, description and what they offer, link to where sponsor want. Any member can apply to be sponsor, admin need to approve
- Advisory: members can browse advisors who have name, bio, expertise and contact information. Member can also browse companies seeking advisors who post what htey need and how much equity they provide. members can post seeking advisors or post their own advisor profile. free members cannot see contact information or view seeking advisory full details
- Raising Funds: Members can submit a request with information about their company and how much they want to raise. Admin will review them and forward introduction if make sense and reply to user in their thread when this happens. free members cannot submit raising fund request
- Education: list of webinars with date, link, add to calendar buton posted by other members. Members can post webinars if admin approves. Free members cannot see link or add to calendar will need to upgrade to join to see link
- Notifications: list of notifications about coupon applied, jackpot won, someone reply to opportunity, someone reply to service provider, raising fund status change, request for advisory
- Billing: see the subscription plan they are on (there only 1 plan) and invoices and able to cancel subscription. also button to see plan
- Affiliate: see affilate link, how it works, affilate payments and can convert affilate payment to another jackpot ticket
- Support: List out the support ticket user requested and can submit new ticket regarding: billing, bug, feedback
- logout
- Opportunity: theres 2 tabs here M & A transactions and Service Request
= Opportunity > M & A transactions Fields name, description, category, Looking for buyer or seller or investment, investment goal, finder fee. Free users cant click to see more details. Premium member can click button to sign NDA which popup a modal of NDA and sign the NDA to get access to deal room link. Premium user can submit investment inquiry for how much to invest and can represent the final investor to get finder fee. We will show table of cap table of investment remaining. Opportunity listed can also put up service request for member to submit proposal for doing service for the deal.
= Opportunity > Service Request field project name, description, budget range, timeline, status. free members cant click and see details. Premium members can submit proposal for service request with proposal link. Service request owner can see all proposals in a table and chat in thread style with proposal sender.