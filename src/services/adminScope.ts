import { AdminProfile } from '../models/mongodb/AdminProfile';
import { Institution } from '../models/mongodb/Institution';

export async function getAdminScope(userId: string) {
  const admin = await AdminProfile.findOne({ userId }).lean();
  if (!admin) return null;
  const institutions = await Institution.find({
    codigoIbge: admin.codigoIbge,
    ativa: { $ne: false },
  }).lean();
  return {
    admin,
    institutions,
    institutionIds: institutions.map((institution) => institution._id),
  };
}
