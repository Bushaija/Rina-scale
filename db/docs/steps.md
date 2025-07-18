Step 1: Create TB Constants (15 min)
- Create features/planning/constants/tb/tb-activities.ts
- Follow exact HIV/Malaria pattern
- Use the categorized activities we just defined

Step 2: Create TB Schema (10 min)
- Create features/planning/schema/tb/plan-form-schema.ts
- Copy from Malaria schema (simpler than HIV)
- Update activity generation function

Step 3: Update Database Seeds (20 min)
- Add TB activities to db/seeds/planning_activities.ts
- Add TB categories to planning categories seed
- Run: npm run db:seed

Step 4: Update Data Mappings (15 min)
- Add TB mappings to use-get-planning-by-facility-id.ts
- Add TB to project code mappings
- Add TB activity description mappings

Step 5: Frontend Integration (30 min)
- Add TB import to planning new page
- Update program selector logic
- Test all three programs work

Step 6: Testing & Verification (30 min)
- Create TB plan for hospital
- Create TB plan for health center
- Test view/edit pages
- Test execution workflow