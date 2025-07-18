export type ActivityEntry = {
    activity: string;
    typeOfActivity: string;
  };
  
  export type ActivityCategoryType = {
    [categoryName: string]: ActivityEntry[];
  };