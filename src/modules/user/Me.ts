import { Resolver, Query, Ctx, Authorized } from "type-graphql";
import { User, UserRole } from "../../entity/User";
import { MyContext } from "../../types/context";

@Resolver()
export class MeResolver {
  @Query(() => [User])
  @Authorized("USER")
  async users(): Promise<User[]> {
    return await User.find();
  }

  @Query(() => User, { nullable: true })
  @Authorized(UserRole["USER"])
  async me(@Ctx() ctx: MyContext): Promise<User | null | undefined> {
    if (!ctx.req.userId) return null;
    return await User.findOne({ where: { id: ctx.req.userId } });
  }
}