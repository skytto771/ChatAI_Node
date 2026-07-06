// controllers/ConversationController.ts
import { Request, Response } from "express";
import { ConversationService } from "@/services/ConversationService";
import { ResponseUtil } from "@/util/responseUtil";
import { BusinessCode } from "@/constants/http-status.enum";

export class ConversationController {
  /**
   * 创建新会话
   */
  static async create(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { title, model } = req.body;

    try {
      const conversation = await ConversationService.createConversation(
        userId,
        {
          title,
          model,
        },
      );

      res
        .status(201)
        .json(ResponseUtil.created(conversation, "会话创建成功", requestId));
    } catch (error) {
      console.error("创建会话失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "创建会话失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 获取会话详情
   */
  static async getById(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;

    try {
      const conversation = await ConversationService.getConversationById(
        id,
        userId,
      );

      if (!conversation) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }

      res.json(
        ResponseUtil.success(conversation, "获取会话详情成功", requestId),
      );
    } catch (error) {
      console.error("获取会话详情失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取会话详情失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 获取用户的会话列表
   */
  static async getList(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { isArchived } = req.body;

    try {
      const result = await ConversationService.getUserConversations(userId, {
        isArchived:
          isArchived === "true"
            ? true
            : isArchived === "false"
              ? false
              : undefined,
      });

      res.json(ResponseUtil.success(result, "获取会话列表成功", requestId));
    } catch (error) {
      console.error("获取会话列表失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取会话列表失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 更新会话信息
   */
  static async update(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;
    const { title, model } = req.body;

    try {
      const conversation = await ConversationService.updateConversation(
        id,
        userId,
        {
          title,
          model,
        },
      );

      if (!conversation) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(conversation, "更新会话成功", requestId));
    } catch (error) {
      console.error("更新会话失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "更新会话失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 归档会话
   */
  static async archive(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;

    try {
      const conversation = await ConversationService.toggleArchive(
        id,
        userId,
        true,
      );

      if (!conversation) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(conversation, "归档成功", requestId));
    } catch (error) {
      console.error("归档失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "归档失败", requestId),
        );
    }
  }

  /**
   * 取消归档
   */
  static async unarchive(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;

    try {
      const conversation = await ConversationService.toggleArchive(
        id,
        userId,
        false,
      );

      if (!conversation) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(conversation, "取消归档成功", requestId));
    } catch (error) {
      console.error("取消归档失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "取消归档失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 归档会话
   */
  static async delete(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;

    try {
      const deleted = await ConversationService.deleteConversation(id, userId);

      if (!deleted) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(null, "归档成功", requestId));
    } catch (error) {
      console.error("归档会话失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "归档会话失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 永久删除单个归档会话
   */
  static async deleteSingleArchived(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id } = req.body;

    if (!id) {
      res
        .status(400)
        .json(
          ResponseUtil.error(
            BusinessCode.PARAM_ERROR,
            "缺少会话 ID",
            requestId,
          ),
        );
      return;
    }

    try {
      const deleted =
        await ConversationService.deleteArchivedConversation(id, userId);

      if (!deleted) {
        res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "归档会话不存在",
              requestId,
            ),
          );
        return;
      }

      res.json(ResponseUtil.success(null, "归档会话已删除", requestId));
    } catch (error) {
      console.error("删除归档会话失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "删除归档会话失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 删除全部归档会话
   */
  static async deleteArchived(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;

    try {
      const deletedCount =
        await ConversationService.deleteArchivedConversations(userId);

      res.json(
        ResponseUtil.success(
          { deletedCount },
          `成功删除 ${deletedCount} 个归档会话`,
          requestId,
        ),
      );
    } catch (error) {
      console.error("批量删除失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "批量删除失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 获取会话统计
   */
  static async getStats(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;

    try {
      const stats = await ConversationService.getConversationStats(userId);

      res.json(ResponseUtil.success(stats, "获取统计成功", requestId));
    } catch (error) {
      console.error("获取统计失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取统计失败",
            requestId,
          ),
        );
    }
  }

  /**
   * 切换会话置顶状态
   */
  static async toggleTop(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { id, isTop } = req.body;

    if (!id) {
      return res
        .status(400)
        .json(
          ResponseUtil.error(
            BusinessCode.PARAM_MISSING,
            "会话ID不能为空",
            requestId,
          ),
        );
    }

    try {
      const conversation = await ConversationService.getConversationById(
        id,
        userId,
      );
      if (!conversation) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "会话不存在",
              requestId,
            ),
          );
      }
      await ConversationService.updateConversation(id, userId, {
        isTop,
      } as any);

      res.json(
        ResponseUtil.success(
          { isTop },
          isTop ? "已置顶" : "已取消置顶",
          requestId,
        ),
      );
    } catch (error) {
      console.error("切换置顶失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "操作失败", requestId),
        );
    }
  }
}
