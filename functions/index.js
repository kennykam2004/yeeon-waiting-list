const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const ADMIN_EMAIL = 'kennykam2004@gmail.com'; // 管理員 email

// 檢查是否為管理員
async function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// 創建用戶
exports.createUser = functions.https.onCall(async (data, context) => {
  // 檢查是否已登入
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '需要登入');
  }

  // 檢查是否為管理員
  const adminUser = await admin.auth().getUser(context.auth.uid);
  if (adminUser.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', '只有管理員可以執行此操作');
  }

  const { email, password } = data;

  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', '需要提供 email 和密碼');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    // 同時在 Firestore 記錄批準狀態
    await admin.firestore().collection('approvedUsers').doc(userRecord.uid).set({
      email,
      approved: true,
      approvedBy: context.auth.uid,
      approvedAt: new Date().toISOString()
    });

    return { success: true, uid: userRecord.uid, email: userRecord.email };
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error.message);
  }
});

// 刪除用戶
exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '需要登入');
  }

  const adminUser = await admin.auth().getUser(context.auth.uid);
  if (adminUser.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', '只有管理員可以執行此操作');
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', '需要提供 UID');
  }

  // 不能刪除自己
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', '不能刪除自己的帳號');
  }

  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('approvedUsers').doc(uid).delete();
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error.message);
  }
});

// 獲取所有用戶
exports.listUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '需要登入');
  }

  const adminUser = await admin.auth().getUser(context.auth.uid);
  if (adminUser.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', '只有管理員可以執行此操作');
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map(u => ({
      uid: u.uid,
      email: u.email,
      creationTime: u.metadata.creationTime
    }));

    // 獲取批准狀態
    const approvedSnap = await admin.firestore().collection('approvedUsers').get();
    const approved = {};
    approvedSnap.forEach(doc => {
      approved[doc.id] = doc.data();
    });

    return { success: true, users, approved };
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error.message);
  }
});
