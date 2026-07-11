import session from "express-session";
import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    session: { type: String, required: true },
    expires: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: false },
);

let SessionModel: mongoose.Model<any>;

function getSessionModel() {
  if (!SessionModel) {
    SessionModel =
      mongoose.models["_sessions"] ||
      mongoose.model("_sessions", SessionSchema);
  }
  return SessionModel;
}

export class MongoSessionStore extends session.Store {
  constructor() {
    super();
  }

  get(
    sid: string,
    callback: (err: any, session?: session.SessionData | null) => void,
  ) {
    getSessionModel()
      .findById(sid)
      .lean()
      .exec()
      .then((doc: any) => {
        if (!doc) return callback(null, null);
        if (doc.expires && new Date() > doc.expires) {
          return this.destroy(sid, () => callback(null, null));
        }
        try {
          callback(null, JSON.parse(doc.session));
        } catch {
          callback(null, null);
        }
      })
      .catch(callback);
  }

  set(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: any) => void,
  ) {
    const expires = (sessionData.cookie as any)?.expires
      ? new Date((sessionData.cookie as any).expires)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    getSessionModel()
      .findByIdAndUpdate(
        sid,
        { _id: sid, session: JSON.stringify(sessionData), expires },
        { upsert: true, new: true },
      )
      .exec()
      .then(() => callback?.())
      .catch(callback);
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    getSessionModel()
      .findByIdAndDelete(sid)
      .exec()
      .then(() => callback?.())
      .catch(callback);
  }

  touch(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: any) => void,
  ) {
    const expires = (sessionData.cookie as any)?.expires
      ? new Date((sessionData.cookie as any).expires)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    getSessionModel()
      .findByIdAndUpdate(sid, { expires })
      .exec()
      .then(() => callback?.())
      .catch(callback);
  }
}
